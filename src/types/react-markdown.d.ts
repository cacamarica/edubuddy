declare module 'react-markdown' {
  import * as React from 'react';

  export interface ReactMarkdownProps {
    children?: string;
    [key: string]: any;
  }

  const ReactMarkdown: React.FC<ReactMarkdownProps>;
  export default ReactMarkdown;
}
