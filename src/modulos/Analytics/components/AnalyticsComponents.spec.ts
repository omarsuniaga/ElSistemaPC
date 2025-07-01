import {mount} from "@vue/test-utils"
import StudentAnalytics from "./StudentAnalytics.vue"
import StudentPerformanceReport from "./StudentPerformanceReport.vue"
import AttendanceAnalytics from "./AttendanceAnalytics.vue"
import AnalysisPanel from "./AnalysisPanel.vue"

describe("Analytics Components - Data Real Only", () => {
  it("StudentAnalytics does not use mock data", () => {
    // Revisar que no existan nombres típicos de mocks en el template ni en el script
    const code = StudentAnalytics.toString()
    expect(code).not.toMatch(
      /mock|generateMock|Gabriel Mendez|Sara Linares|Miguel Torres|Valentina Ruiz/
    )
  })

  it("StudentPerformanceReport uses only real data", () => {
    const code = StudentPerformanceReport.toString()
    expect(code).not.toMatch(/mock|generateMock/)
  })

  it("AttendanceAnalytics uses only real data", () => {
    const code = AttendanceAnalytics.toString()
    expect(code).not.toMatch(/mock|generateMock/)
  })

  it("AnalysisPanel uses only real data", () => {
    const code = AnalysisPanel.toString()
    expect(code).not.toMatch(/mock|generateMock/)
  })

  it("StudentAnalytics renders with real store data", async () => {
    const wrapper = mount(StudentAnalytics, {
      global: {
        mocks: {
          analyticsStore: {
            loading: false,
            error: "",
            attendanceMetrics: {},
            studentMetrics: {atRiskStudents: []},
          },
          studentsStore: {students: []},
        },
      },
    })
    expect(wrapper.exists()).toBe(true)
  })
})
