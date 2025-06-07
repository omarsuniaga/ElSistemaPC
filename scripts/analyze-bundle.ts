#!/usr/bin/env node

/**
 * Bundle Analysis Script
 * Analyzes the production bundle to identify optimization opportunities
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface BundleAnalysis {
  totalSize: number;
  gzippedSize: number;
  chunks: ChunkInfo[];
  recommendations: string[];
}

interface ChunkInfo {
  name: string;
  size: number;
  gzippedSize: number;
  modules?: string[];
}

class BundleAnalyzer {
  private distPath: string;
  
  constructor() {
    this.distPath = join(process.cwd(), 'dist');
  }

  async analyze(): Promise<BundleAnalysis> {
    console.log('🔍 Analyzing bundle...');
    
    // Build the project first
    this.buildProject();
    
    // Analyze the built files
    const chunks = this.analyzeChunks();
    const recommendations = this.generateRecommendations(chunks);
    
    const analysis: BundleAnalysis = {
      totalSize: chunks.reduce((sum, chunk) => sum + chunk.size, 0),
      gzippedSize: chunks.reduce((sum, chunk) => sum + chunk.gzippedSize, 0),
      chunks,
      recommendations
    };

    this.printReport(analysis);
    return analysis;
  }

  private buildProject() {
    console.log('🏗️ Building project...');
    try {
      execSync('npm run build', { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Build failed:', error);
      process.exit(1);
    }
  }

  private analyzeChunks(): ChunkInfo[] {
    if (!existsSync(this.distPath)) {
      throw new Error('Dist directory not found. Please run build first.');
    }

    console.log('📊 Analyzing chunks...');
    
    try {
      // Use bundlemon or similar tool for detailed analysis
      const result = execSync('npx bundlemon --analyze --output json', { 
        encoding: 'utf8',
        cwd: process.cwd()
      });
      
      return JSON.parse(result);
    } catch (error) {
      // Fallback to manual analysis
      return this.manualAnalysis();
    }
  }

  private manualAnalysis(): ChunkInfo[] {
    const fs = require('fs');
    const path = require('path');
    const chunks: ChunkInfo[] = [];

    const analyzeDir = (dir: string) => {
      const files = fs.readdirSync(dir);
      
      files.forEach((file: string) => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isFile() && (file.endsWith('.js') || file.endsWith('.css'))) {
          const size = stats.size;
          const gzippedSize = this.estimateGzipSize(filePath);
          
          chunks.push({
            name: file,
            size,
            gzippedSize
          });
        }
      });
    };

    analyzeDir(path.join(this.distPath, 'assets'));
    return chunks;
  }

  private estimateGzipSize(filePath: string): number {
    try {
      const content = readFileSync(filePath);
      const zlib = require('zlib');
      const compressed = zlib.gzipSync(content);
      return compressed.length;
    } catch (error) {
      return 0;
    }
  }

  private generateRecommendations(chunks: ChunkInfo[]): string[] {
    const recommendations: string[] = [];
    
    // Check for large chunks
    chunks.forEach(chunk => {
      if (chunk.size > 500 * 1024) { // 500KB
        recommendations.push(
          `📦 ${chunk.name} is large (${this.formatSize(chunk.size)}). Consider code splitting.`
        );
      }
    });

    // Check for duplicate dependencies
    const jsChunks = chunks.filter(chunk => chunk.name.endsWith('.js'));
    if (jsChunks.length > 10) {
      recommendations.push(
        '🔄 Many JS chunks detected. Consider optimizing chunk splitting strategy.'
      );
    }

    // Check compression ratio
    chunks.forEach(chunk => {
      const compressionRatio = chunk.gzippedSize / chunk.size;
      if (compressionRatio > 0.8) {
        recommendations.push(
          `📉 ${chunk.name} has poor compression ratio. Consider minification improvements.`
        );
      }
    });

    // General recommendations
    recommendations.push(
      '💡 Enable tree shaking for better bundle optimization',
      '📱 Consider lazy loading for route components',
      '🎯 Use dynamic imports for large libraries',
      '🗜️ Enable Brotli compression on your server'
    );

    return recommendations;
  }

  private printReport(analysis: BundleAnalysis) {
    console.log('\n📈 Bundle Analysis Report');
    console.log('========================\n');
    
    console.log(`📦 Total Bundle Size: ${this.formatSize(analysis.totalSize)}`);
    console.log(`🗜️ Gzipped Size: ${this.formatSize(analysis.gzippedSize)}`);
    console.log(`📊 Compression Ratio: ${((analysis.gzippedSize / analysis.totalSize) * 100).toFixed(1)}%\n`);

    console.log('📋 Chunks Breakdown:');
    analysis.chunks
      .sort((a, b) => b.size - a.size)
      .slice(0, 10) // Show top 10 largest chunks
      .forEach(chunk => {
        console.log(
          `  ${chunk.name.padEnd(30)} ${this.formatSize(chunk.size).padStart(10)} (${this.formatSize(chunk.gzippedSize)} gzipped)`
        );
      });

    console.log('\n💡 Recommendations:');
    analysis.recommendations.forEach(rec => {
      console.log(`  ${rec}`);
    });

    // Performance budget check
    console.log('\n🎯 Performance Budget:');
    const budgets = [
      { name: 'Total JS', limit: 300 * 1024, actual: analysis.chunks.filter(c => c.name.endsWith('.js')).reduce((sum, c) => sum + c.gzippedSize, 0) },
      { name: 'Total CSS', limit: 50 * 1024, actual: analysis.chunks.filter(c => c.name.endsWith('.css')).reduce((sum, c) => sum + c.gzippedSize, 0) },
      { name: 'Total Bundle', limit: 400 * 1024, actual: analysis.gzippedSize }
    ];

    budgets.forEach(budget => {
      const status = budget.actual <= budget.limit ? '✅' : '❌';
      const percentage = ((budget.actual / budget.limit) * 100).toFixed(1);
      console.log(
        `  ${status} ${budget.name}: ${this.formatSize(budget.actual)} / ${this.formatSize(budget.limit)} (${percentage}%)`
      );
    });
  }

  private formatSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }
}

// CLI usage
if (require.main === module) {
  const analyzer = new BundleAnalyzer();
  analyzer.analyze().catch(error => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });
}

export { BundleAnalyzer };
