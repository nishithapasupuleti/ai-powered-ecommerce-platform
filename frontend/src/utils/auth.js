// Auth helper functions

export const getUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
};

export const getToken = () => {
  return localStorage.getItem('access_token');
};

export const isLoggedIn = () => {
  return !!localStorage.getItem('access_token');
};

export const isSeller = () => {
  const user = getUser();
  return user?.role === 'seller';
};

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('authChange'));
};
