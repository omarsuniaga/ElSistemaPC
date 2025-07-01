// En src/utils/notificationUtils.ts
export const showError = (message: string, duration = 3000): void => {
  const errorElement = document.createElement("div")
  errorElement.className =
    "fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg"
  errorElement.textContent = message

  document.body.appendChild(errorElement)
  setTimeout(() => {
    document.body.removeChild(errorElement)
  }, duration)
}
