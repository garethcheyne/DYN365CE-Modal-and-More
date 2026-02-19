/**
 * HowTo/Documentation Page - Renders README.md with react-markdown
 * Used as tab content in About.tsx - no Layout wrapper needed
 */
import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import {
  makeStyles,
  tokens,
  Spinner,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Button,
} from '@fluentui/react-components';

declare const PACKAGE_VERSION: string;

const useStyles = makeStyles({
  container: {
    padding: tokens.spacingHorizontalXL,
    maxWidth: '960px',
    margin: '0 auto',
    backgroundColor: tokens.colorNeutralBackground1,
    minHeight: '100%',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXXXL,
    gap: tokens.spacingVerticalM,
  },
  error: {
    margin: tokens.spacingVerticalL,
  },
  docs: {
    lineHeight: '1.6',
    '& h1': {
      fontSize: tokens.fontSizeBase600,
      fontWeight: tokens.fontWeightSemibold,
      borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
      paddingBottom: tokens.spacingVerticalM,
      marginTop: tokens.spacingVerticalXXL,
      marginBottom: tokens.spacingVerticalL,
    },
    '& h2': {
      fontSize: tokens.fontSizeBase500,
      fontWeight: tokens.fontWeightSemibold,
      marginTop: tokens.spacingVerticalXL,
      marginBottom: tokens.spacingVerticalM,
    },
    '& h3': {
      fontSize: tokens.fontSizeBase400,
      fontWeight: tokens.fontWeightSemibold,
      marginTop: tokens.spacingVerticalL,
      marginBottom: tokens.spacingVerticalS,
    },
    '& p': {
      marginBottom: tokens.spacingVerticalM,
    },
    '& pre': {
      backgroundColor: tokens.colorNeutralBackground3,
      padding: tokens.spacingHorizontalM,
      borderRadius: tokens.borderRadiusMedium,
      overflowX: 'auto',
      marginBottom: tokens.spacingVerticalM,
    },
    '& code': {
      fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
      fontSize: '0.9em',
    },
    '& code:not(pre code)': {
      backgroundColor: tokens.colorNeutralBackground3,
      padding: '2px 6px',
      borderRadius: tokens.borderRadiusSmall,
    },
    '& a': {
      color: tokens.colorBrandForeground1,
      textDecoration: 'none',
      '&:hover': {
        textDecoration: 'underline',
      },
    },
    '& table': {
      width: '100%',
      borderCollapse: 'collapse',
      marginBottom: tokens.spacingVerticalM,
    },
    '& th, & td': {
      border: `1px solid ${tokens.colorNeutralStroke1}`,
      padding: tokens.spacingVerticalS,
      textAlign: 'left',
    },
    '& th': {
      backgroundColor: tokens.colorNeutralBackground3,
      fontWeight: tokens.fontWeightSemibold,
    },
    '& ul, & ol': {
      marginBottom: tokens.spacingVerticalM,
      paddingLeft: tokens.spacingHorizontalXL,
    },
    '& li': {
      marginBottom: tokens.spacingVerticalXS,
    },
    '& blockquote': {
      borderLeft: `4px solid ${tokens.colorBrandBackground}`,
      margin: `${tokens.spacingVerticalM} 0`,
      paddingLeft: tokens.spacingHorizontalM,
      color: tokens.colorNeutralForeground2,
    },
  },
});

export const HowTo: React.FC = () => {
  const styles = useStyles();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDocumentation = async () => {
      try {
        // Try to load README.md from various locations
        const urls = [
          'README.md.html',
          'README.md',
          '../README.md',
          './README.md.html'
        ];

        let markdown = '';

        for (const url of urls) {
          try {
            const response = await fetch(url);
            if (response.ok) {
              markdown = await response.text();
              break;
            }
          } catch {
            // Try next URL
          }
        }

        if (!markdown) {
          throw new Error('Could not load documentation');
        }

        setContent(markdown);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load documentation');
        setLoading(false);
      }
    };

    loadDocumentation();
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <Spinner size="large" />
          <span>Loading documentation...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <MessageBar intent="error" className={styles.error}>
          <MessageBarBody>
            <MessageBarTitle>Error Loading Documentation</MessageBarTitle>
            {error}
          </MessageBarBody>
        </MessageBar>
        <Button appearance="primary" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.docs}>
        <Markdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            // Links open in new tab
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
            // Code blocks - react-markdown wraps in pre > code
            code: ({ className, children, node, ...props }) => {
              // Check if this is inside a <pre> (code block) or inline
              const isInline = !className && !node?.position;
              if (isInline) {
                return <code {...props}>{children}</code>;
              }
              // For code blocks, just render the code element - pre will wrap it
              return <code className={className} {...props}>{children}</code>;
            },
          }}
        >
          {content}
        </Markdown>
      </div>
    </div>
  );
};

export default HowTo;
