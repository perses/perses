import { ReactNode } from 'react';
import { HeaderView } from './Header';
import { FooterView } from './Footer';

export interface CoreProps {
  children: ReactNode;
}

export default function CoreView(props: CoreProps) {
  return (
    <div>
      <HeaderView />
      {props.children}
      <FooterView />
    </div>
  );
}
