import { Typography } from '@mui/material';
import { ReactNode } from 'react';

export interface StorySectionProps {
  title: string;
  level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5';
  children: ReactNode;
}

/**
 * Simple helper component to lay out more complex stories where you want to
 * lay out a combination of examples with a title and content.
 */
export function StorySection({ title, level, children }: StorySectionProps) {
  return (
    <div>
      <Typography variant={level} gutterBottom>
        {title}
      </Typography>
      {children}
    </div>
  );
}
