import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: '0.5rem',
          fontFamily: 'var(--font-sans)',
          backgroundColor: 'var(--color-bg)',
          color: 'var(--color-text)',
        }}>
          <p style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Something broke on our end.</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>
            We're working on it. Try reloading.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '0.75rem',
              padding: '0.5rem 1.25rem',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: 'var(--color-text)',
            }}
          >
            Reload
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
