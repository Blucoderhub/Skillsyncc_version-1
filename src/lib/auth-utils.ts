export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

// Redirect to login with a toast notification
export function redirectToLogin(toast?: (options: { title: string; description: string; variant: string }) => void) {
  if (toast) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
  }
  setTimeout(() => {
    const baseURL = import.meta.env.VITE_API_URL || "";
    window.location.href = `${baseURL}/api/login`;
  }, 500);
}
