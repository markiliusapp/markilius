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
          gap: '1rem',
          fontFamily: 'inherit',
        }}>
          <p style={{ fontSize: '1rem', opacity: 0.6 }}>Something went wrong.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1.25rem',
              border: '1px solid currentColor',
              borderRadius: '6px',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '0.875rem',
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
