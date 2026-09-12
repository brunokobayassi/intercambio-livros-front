import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BrandLogo } from '../../components/layout/BrandLogo'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { useAuth } from './useAuth'
import { validateLogin } from './login-validation'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [values, setValues] = useState({ email: '', senha: '' })
  const [errors, setErrors] = useState({})
  const [requestError, setRequestError] = useState(
    location.state?.sessionExpired
      ? 'Sua sessão expirou. Entre novamente para continuar.'
      : '',
  )
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
    setRequestError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateLogin(values)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)
    setRequestError('')

    try {
      await login({ email: values.email.trim(), senha: values.senha })
      navigate('/livros', { replace: true })
    } catch (error) {
      setRequestError(error?.message || 'Não foi possível entrar. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-glow login-glow--primary" aria-hidden="true" />
      <div className="login-glow login-glow--amber" aria-hidden="true" />

      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand-mark" aria-hidden="true">
          <BrandLogo compact decorative />
        </div>
        <p className="eyebrow login-eyebrow">Intercâmbio de Livros</p>
        <div className="login-heading">
          <h1 id="login-title">Entre na sua conta</h1>
          <p>Acesse para gerenciar seus livros e propor trocas com outros leitores.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <TextField
            label="E-mail"
            name="email"
            type="email"
            value={values.email}
            onChange={updateField}
            autoComplete="email"
            inputMode="email"
            icon={<Mail aria-hidden="true" />}
            error={errors.email}
            disabled={isSubmitting}
          />
          <TextField
            label="Senha"
            name="senha"
            type={showPassword ? 'text' : 'password'}
            value={values.senha}
            onChange={updateField}
            autoComplete="current-password"
            icon={<LockKeyhole aria-hidden="true" />}
            error={errors.senha}
            disabled={isSubmitting}
            endAdornment={
              <button
                className="field-action"
                type="button"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={showPassword}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            }
          />

          {requestError ? (
            <div className="form-alert" role="alert">
              <span className="form-alert__icon" aria-hidden="true">!</span>
              <div>
                <strong>Não foi possível entrar</strong>
                <p>{requestError}</p>
              </div>
            </div>
          ) : null}

          <Button
            className="login-submit"
            type="submit"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            rightIcon={!isSubmitting ? <ArrowRight /> : null}
          >
            {isSubmitting ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </section>
    </main>
  )
}
