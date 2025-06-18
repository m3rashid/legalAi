interface User {
  id: number;
  name: string;
  gh_username: string;
  avatar_url?: string;
}

declare namespace Express {
  interface Request {
    user?: User;
    isAuthenticated: boolean;
  }
}
