function matchesPath(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function isStudentPath(pathname: string) {
  return (
    matchesPath(pathname, "/programas") || matchesPath(pathname, "/reels")
  );
}

export function requiresKeycloakAuth(pathname: string) {
  if (pathname === "/auth-debug") {
    return true;
  }

  return isStudentPath(pathname);
}

export function getStudentPostLoginPath() {
  return "/programas";
}
