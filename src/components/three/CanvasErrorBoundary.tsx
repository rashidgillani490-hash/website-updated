"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Called once when a render error is caught below this boundary. */
  onError: () => void;
}

interface State {
  hasError: boolean;
}

/**
 * Scoped boundary for the WebGL canvas. If three.js / react-three-fiber throws
 * (context creation failure, shader error, lost context during init), this
 * stops the error from reaching the route-level `error.tsx` and lets
 * <PerfumeExperience /> fall back to its poster. There is only one fallback
 * path — the poster — shared with the no-WebGL and not-yet-loaded cases.
 */
export class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.hasError ? null : this.props.children;
  }
}
