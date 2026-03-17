import type { DetailedHTMLProps, HTMLAttributes } from 'react';

declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
      src?: string;
      alt?: string;
      poster?: string;
      exposure?: string;
      ar?: boolean | string;
      'camera-controls'?: boolean | string;
      'auto-rotate'?: boolean | string;
      'auto-rotate-delay'?: string;
      'rotation-per-second'?: string;
      'disable-pan'?: boolean | string;
      'interaction-prompt'?: string;
      'environment-image'?: string;
      'touch-action'?: string;
      'shadow-intensity'?: string;
      'camera-orbit'?: string;
      'min-camera-orbit'?: string;
      'max-camera-orbit'?: string;
      'field-of-view'?: string;
      loading?: 'eager' | 'lazy' | 'auto';
    };
  }
}

export {};
