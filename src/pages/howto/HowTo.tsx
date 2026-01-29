/**
 * HowTo/Documentation Page - Renders README.md with react-markdown
 */
import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Layout } from '../shared/Layout';

declare const PACKAGE_VERSION: string;

export const HowTo: React.FC = () => {
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

  return (
    <Layout currentPage="howto" version={typeof PACKAGE_VERSION !== 'undefined' ? PACKAGE_VERSION : undefined}>
      {loading && (
        <div className="ui-lib-d365-docs">
          <div className="ui-lib-d365-loading">
            <div className="ui-lib-d365-loading__spinner"></div>
            <span>Loading documentation...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="ui-lib-d365-docs">
          <div className="ui-lib-d365-note ui-lib-d365-note--error">
            <span className="ui-lib-d365-note__icon">X</span>
            <div>
              <strong>Error Loading Documentation</strong>
              <p style={{ margin: '8px 0 0 0' }}>{error}</p>
              <button
                className="ui-lib-d365-btn ui-lib-d365-btn--primary"
                style={{ marginTop: '12px' }}
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="ui-lib-d365-docs">
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
              // CSS handles styling via .ui-lib-d365-docs pre and .ui-lib-d365-docs code:not(pre code)
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
      )}
    </Layout>
  );
};

export default HowTo;
