// DRY utility for authenticated fetch requests
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = sessionStorage.getItem("token");
  const apiBase = process.env.REACT_APP_API_URL || "";
  const fullUrl = url.startsWith("/") ? apiBase + url : url;
  const headers = {
    ...(options.headers || {}),
    Authorization: token ? `Bearer ${token}` : "",
  };
  return fetch(fullUrl, { ...options, headers });
}
