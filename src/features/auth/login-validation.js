export function validateLogin({ email, senha }) {
  const errors = {}
  const normalizedEmail = email.trim()

  if (!normalizedEmail) {
    errors.email = 'Informe seu e-mail.'
  } else if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    errors.email = 'Informe um e-mail válido.'
  }

  if (!senha) {
    errors.senha = 'Informe sua senha.'
  }

  return errors
}
