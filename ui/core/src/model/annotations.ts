import { Definition } from './definitions';
import { Display } from './display';

export type AnnotationEvent = {
  timestamp: number;
  endTimestamp?: number;
  color?: string;
  title?: string;
};

export interface AnnotationSpec {
  name: string;
  display?: Display & {
    hidden?: boolean;
  };
}

export interface StaticAnnotationDefinition extends Definition<StaticAnnotationSpec> {
  kind: 'StaticAnnotation';
}
export interface StaticAnnotationSpec extends AnnotationSpec {
  annotations: AnnotationEvent[];
}

// export interface QueryAnnotationDefinition<PluginSpec = UnknownSpec>
//   extends Definition<QueryAnnotationSpec<PluginSpec>> {
//   kind: 'QueryAnnotation';
// }

// export interface QueryAnnotationSpec<PluginSpec> extends AnnotationSpec {
//   plugin: Definition<PluginSpec>;
// }

export type AnnotationDefinition = StaticAnnotationDefinition;

export interface AnnotationsProviderProps {
  children: React.ReactNode;
  initialAnnotationDefinitions?: AnnotationDefinition[];
}
