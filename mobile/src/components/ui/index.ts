// ==========================================
// DEVOLÓN — Design System exports
//
// Importa todo desde aquí:
//
//   import { Screen, Button, Card, Input, Header, Section } from '@/components/ui';
//
// Reglas:
//  - Toda pantalla nueva DEBE envolverse en <Screen>.
//  - CTAs y acciones → <Button> con variantes. Cero TouchableOpacity con
//    styles inline para botones.
//  - Inputs → <Input variant="underline"|"filled">.
//  - Contenedores con peso visual → <Card>.
//  - Bloques con título → <Section>.
//  - Sub-pantallas que no usan el header nativo del stack → <Header>.
//
// ==========================================

export { default as Screen } from './Screen';
export { default as Button } from './Button';
export { default as Card } from './Card';
export { default as Input } from './Input';
export { default as Header } from './Header';
export { default as Section } from './Section';

// Estado / feedback
export { default as Toast } from './Toast';
export type { ToastType } from './Toast';
export { default as EmptyState } from './EmptyState';
export { default as NetworkError } from './NetworkError';
export { default as ErrorBoundary } from './ErrorBoundary';
