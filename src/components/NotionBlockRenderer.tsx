"use client";

import { FC, useEffect, useRef } from "react";
import { BlockObjectResponse, RichTextItemResponse } from "@notionhq/client/build/src/api-endpoints";
import katex from "katex";
import "katex/dist/katex.min.css";
import { Tweet } from "react-tweet";
import { ExternalLink } from "lucide-react";
import Image from "next/image";

interface NotionBlockRendererProps {
  blocks: BlockObjectResponse[];
}

export const NotionBlockRenderer: FC<NotionBlockRendererProps> = ({ blocks }) => {
  const renderBlock = (block: BlockObjectResponse): React.ReactElement | null => {
    const key = block.id;

    switch (block.type) {
      case "paragraph":
        const paragraph = block.paragraph;
        if (!paragraph.rich_text || paragraph.rich_text.length === 0) {
          return <p key={key} className="mb-4">&nbsp;</p>;
        }
        return (
          <p key={key} className="mb-4">
            {renderRichText(paragraph.rich_text)}
          </p>
        );

      case "heading_1":
        return (
          <h1 key={key} className="text-3xl font-bold mb-4 mt-8">
            {renderRichText(block.heading_1.rich_text)}
          </h1>
        );

      case "heading_2":
        return (
          <h2 key={key} className="text-2xl font-semibold mb-3 mt-6">
            {renderRichText(block.heading_2.rich_text)}
          </h2>
        );

      case "heading_3":
        return (
          <h3 key={key} className="text-xl font-medium mb-2 mt-4">
            {renderRichText(block.heading_3.rich_text)}
          </h3>
        );

      case "bulleted_list_item":
        return (
          <li key={key} className="ml-6 mb-1 list-disc">
            {renderRichText(block.bulleted_list_item.rich_text)}
          </li>
        );

      case "numbered_list_item":
        return (
          <li key={key} className="ml-6 mb-1 list-decimal">
            {renderRichText(block.numbered_list_item.rich_text)}
          </li>
        );

      case "quote":
        return (
          <blockquote key={key} className="border-l-4 border-gray-300 pl-4 italic my-4">
            {renderRichText(block.quote.rich_text)}
          </blockquote>
        );

      case "code":
        return (
          <pre key={key} className="bg-gray-100 rounded p-4 overflow-x-auto my-4">
            <code className={`language-${block.code.language || 'plaintext'}`}>
              {block.code.rich_text.map(t => t.plain_text).join('')}
            </code>
          </pre>
        );

      case "equation":
        return <MathBlock key={key} latex={block.equation.expression} />;

      case "divider":
        return <hr key={key} className="my-8 border-gray-300" />;

      case "image":
        const imageUrl = block.image.type === 'external' 
          ? block.image.external.url 
          : block.image.file.url;
        return (
          <figure key={key} className="my-6">
            <Image src={imageUrl} alt="" width={800} height={400} className="w-full rounded object-cover" />
            {block.image.caption && block.image.caption.length > 0 && (
              <figcaption className="text-center text-sm text-gray-600 mt-2">
                {renderRichText(block.image.caption)}
              </figcaption>
            )}
          </figure>
        );

      case "embed":
        const embedUrl = block.embed.url;
        
        // Check if it's a Twitter/X embed
        if (embedUrl.includes('twitter.com') || embedUrl.includes('x.com')) {
          const tweetId = extractTweetId(embedUrl);
          if (tweetId) {
            return (
              <div key={key} className="my-6 flex justify-center">
                <Tweet id={tweetId} />
              </div>
            );
          }
        }
        
        // Default embed as iframe
        return (
          <div key={key} className="my-6">
            <iframe
              src={embedUrl}
              className="w-full h-96 rounded border"
              title="Embedded content"
              loading="lazy"
            />
          </div>
        );

      case "bookmark":
        const bookmarkUrl = block.bookmark.url;
        const bookmarkCaption = block.bookmark.caption;
        
        return (
          <a
            key={key}
            href={bookmarkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block my-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-medium text-blue-600 hover:underline">
                  {bookmarkCaption && bookmarkCaption.length > 0 
                    ? renderRichText(bookmarkCaption) 
                    : bookmarkUrl}
                </div>
                <div className="text-sm text-gray-500 mt-1">{new URL(bookmarkUrl).hostname}</div>
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
            </div>
          </a>
        );

      case "callout":
        const calloutIcon = block.callout.icon;
        const calloutContent = block.callout.rich_text;
        
        return (
          <div key={key} className="my-4 p-4 bg-gray-50 border-l-4 border-blue-500 rounded">
            <div className="flex items-start">
              {calloutIcon && (
                <span className="mr-2 text-xl">
                  {calloutIcon.type === 'emoji' ? calloutIcon.emoji : '💡'}
                </span>
              )}
              <div className="flex-1">
                {renderRichText(calloutContent)}
              </div>
            </div>
          </div>
        );

      case "toggle":
        return (
          <details key={key} className="my-4">
            <summary className="cursor-pointer font-medium hover:text-gray-600">
              {renderRichText(block.toggle.rich_text)}
            </summary>
            <div className="mt-2 ml-4">
              {/* Children blocks would be rendered here if available */}
            </div>
          </details>
        );

      case "table":
        return (
          <div key={key} className="my-6 overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <tbody>
                {/* Table rows would be rendered here - need child blocks */}
              </tbody>
            </table>
          </div>
        );

      case "video":
        const videoUrl = block.video.type === 'external'
          ? block.video.external.url
          : block.video.file.url;
        
        // Check if it's a YouTube video
        if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
          const videoId = extractYouTubeId(videoUrl);
          if (videoId) {
            return (
              <div key={key} className="my-6 aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  className="w-full h-full rounded"
                  title="YouTube video"
                  allowFullScreen
                />
              </div>
            );
          }
        }
        
        return (
          <video key={key} controls className="w-full my-6 rounded">
            <source src={videoUrl} />
            Your browser does not support the video tag.
          </video>
        );

      default:
        console.log(`Unsupported block type: ${block.type}`);
        return null;
    }
  };

  const renderRichText = (richTexts: RichTextItemResponse[]): React.ReactElement[] => {
    const result: React.ReactElement[] = [];
    
    richTexts.forEach((item, index) => {
      // Check if this is an equation type
      if (item.type === 'equation') {
        result.push(<InlineMath key={`equation-${index}`} latex={item.equation.expression} />);
        return;
      }
      
      // Handle regular text
      const { annotations } = item;
      const textContent = item.plain_text;
      
      // Process inline math - look for $...$ patterns in the text (for backwards compatibility)
      const mathRegex = /\$([^\$]+)\$/g;
      let lastIndex = 0;
      let match;
      const segments: (string | React.ReactElement)[] = [];
      
      while ((match = mathRegex.exec(textContent)) !== null) {
        // Add text before the math expression
        if (match.index > lastIndex) {
          segments.push(textContent.substring(lastIndex, match.index));
        }
        // Add the math expression
        segments.push(<InlineMath key={`math-${index}-${match.index}`} latex={match[1]} />);
        lastIndex = match.index + match[0].length;
      }
      
      // Add any remaining text after the last math expression
      if (lastIndex < textContent.length) {
        segments.push(textContent.substring(lastIndex));
      }
      
      // If no math was found, treat the entire text as a single segment
      if (segments.length === 0) {
        segments.push(textContent);
      }
      
      // Apply text formatting to each segment
      segments.forEach((segment, segIndex) => {
        if (typeof segment !== 'string') {
          // It's already a math component, just add it
          result.push(segment);
          return;
        }
        
        let content: React.ReactNode = segment;
        
        if (annotations.bold) {
          content = <strong>{content}</strong>;
        }
        if (annotations.italic) {
          content = <em>{content}</em>;
        }
        if (annotations.underline) {
          content = <u>{content}</u>;
        }
        if (annotations.strikethrough) {
          content = <s>{content}</s>;
        }
        if (annotations.code) {
          // Don't process math in code blocks
          content = <code className="bg-gray-100 px-1 rounded text-sm">{segment}</code>;
        }
        
        let element = <span key={`${index}-${segIndex}`}>{content}</span>;
        
        if (item.href) {
          element = (
            <a key={`${index}-${segIndex}`} href={item.href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              {content}
            </a>
          );
        }
        
        result.push(element);
      });
    });
    
    return result;
  };

  // Group consecutive list items
  const groupedBlocks: (BlockObjectResponse | BlockObjectResponse[])[] = [];
  let currentList: BlockObjectResponse[] = [];
  let currentListType: string | null = null;

  blocks.forEach((block) => {
    if (block.type === "bulleted_list_item" || block.type === "numbered_list_item") {
      if (currentListType === block.type) {
        currentList.push(block);
      } else {
        if (currentList.length > 0) {
          groupedBlocks.push(currentList);
        }
        currentList = [block];
        currentListType = block.type;
      }
    } else {
      if (currentList.length > 0) {
        groupedBlocks.push(currentList);
        currentList = [];
        currentListType = null;
      }
      groupedBlocks.push(block);
    }
  });

  if (currentList.length > 0) {
    groupedBlocks.push(currentList);
  }

  return (
    <div className="notion-content prose prose-lg max-w-none">
      {groupedBlocks.map((item, index) => {
        if (Array.isArray(item)) {
          const listType = item[0].type === "bulleted_list_item" ? "ul" : "ol";
          const ListTag = listType;
          return (
            <ListTag key={`list-${index}`} className="mb-4">
              {item.map(block => renderBlock(block))}
            </ListTag>
          );
        } else {
          return renderBlock(item);
        }
      })}
    </div>
  );
};

// Helper component for math blocks
const MathBlock: FC<{ latex: string }> = ({ latex }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      try {
        katex.render(latex, ref.current, {
          displayMode: true,
          throwOnError: false,
        });
      } catch (error) {
        console.error("KaTeX error:", error);
        if (ref.current) {
          ref.current.innerHTML = `<pre>${latex}</pre>`;
        }
      }
    }
  }, [latex]);

  return <div ref={ref} className="my-4 overflow-x-auto" />;
};

// Helper component for inline math
const InlineMath: FC<{ latex: string }> = ({ latex }) => {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current) {
      try {
        katex.render(latex, ref.current, {
          displayMode: false,
          throwOnError: false,
        });
      } catch (error) {
        console.error("KaTeX error:", error);
        if (ref.current) {
          ref.current.innerHTML = latex;
        }
      }
    }
  }, [latex]);

  return <span ref={ref} className="inline-block mx-1" />;
};

// Helper function to extract tweet ID from URL
function extractTweetId(url: string): string | null {
  const match = url.match(/(?:twitter|x)\.com\/(?:#!\/)?(?:\w+)\/status(?:es)?\/(\d+)/);
  return match ? match[1] : null;
}

// Helper function to extract YouTube video ID
function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
  return match ? match[1] : null;
}