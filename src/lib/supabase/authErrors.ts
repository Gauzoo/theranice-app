type ErrorLike = {
  message?: unknown;
  code?: unknown;
};

function normalizeAuthError(error: unknown): { message: string; code: string } {
  if (error instanceof Error) {
    const errorLike = error as ErrorLike;
    return {
      message: (error.message || "").toLowerCase(),
      code: typeof errorLike.code === "string" ? errorLike.code.toLowerCase() : "",
    };
  }

  if (typeof error === "object" && error !== null) {
    const errorLike = error as ErrorLike;
    return {
      message: typeof errorLike.message === "string" ? errorLike.message.toLowerCase() : "",
      code: typeof errorLike.code === "string" ? errorLike.code.toLowerCase() : "",
    };
  }

  return { message: "", code: "" };
}

export function translateSupabaseAuthError(error: unknown, fallback: string): string {
  const { message, code } = normalizeAuthError(error);

  const contains = (value: string) => message.includes(value) || code.includes(value);

  if (contains("invalid login credentials") || contains("invalid_credentials")) {
    return "Email ou mot de passe incorrect.";
  }

  if (contains("email not confirmed") || contains("email_not_confirmed")) {
    return "Votre adresse email n'est pas encore confirmee. Verifiez votre boite mail.";
  }

  if (contains("user already registered") || contains("already_registered")) {
    return "Un compte existe deja avec cet email. Veuillez vous connecter.";
  }

  if (contains("password should be at least") || contains("password is too short") || contains("weak_password")) {
    return "Le mot de passe est trop court. Utilisez au moins 6 caracteres.";
  }

  if (contains("unable to validate email address") || contains("invalid email") || contains("invalid_email")) {
    return "Adresse email invalide.";
  }

  if (contains("signup is disabled") || contains("signups not allowed")) {
    return "La creation de compte est desactivee pour le moment.";
  }

  if (contains("rate") || contains("too many") || contains("429") || contains("security purposes")) {
    return "Trop de tentatives. Veuillez patienter quelques minutes avant de reessayer.";
  }

  if (contains("expired") || contains("invalid token") || contains("token has expired")) {
    return "Le lien est expire ou invalide. Veuillez en demander un nouveau.";
  }

  if (contains("network") || contains("fetch") || contains("failed to fetch")) {
    return "Probleme reseau. Verifiez votre connexion puis reessayez.";
  }

  return fallback;
}
