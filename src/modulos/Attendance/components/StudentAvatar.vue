<script setup lang="ts">
defineProps<{
  firstName: string;
  lastName: string;
  size?: 'sm' | 'md' | 'lg';
}>();

// Helper function to generate initials
const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.charAt(0) ?? ''}${lastName?.charAt(0) ?? ''}`.toUpperCase();
};

// Helper function to determine avatar background color based on name
const getAvatarColor = (name: string) => {
  if (!name) return 'bg-gray-500';
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'
  ];
  const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  return colors[hash % colors.length];
};
</script>

<template>
  <div 
    :class="[
      'rounded-full flex items-center justify-center text-white',
      size === 'sm' ? 'w-7 h-7 text-xs' : 
      size === 'lg' ? 'w-12 h-12 text-base' : 
      'w-10 h-10 text-sm',
      getAvatarColor(firstName)
    ]"
  >
    {{ getInitials(firstName, lastName) }}
  </div>
</template>
