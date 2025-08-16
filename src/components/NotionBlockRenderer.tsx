"use client";

import { FC } from "react";
import { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";

interface NotionBlockRendererProps {
  blocks: BlockObjectResponse[];
}

export const NotionBlockRenderer: FC<NotionBlockRendererProps> = ({ blocks }) => {
  const renderBlock = (block: BlockObjectResponse): JSX.Element | null => {
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

      case "divider":
        return <hr key={key} className="my-8 border-gray-300" />;

      case "image":
        const imageUrl = block.image.type === 'external' 
          ? block.image.external.url 
          : block.image.file.url;
        return (
          <figure key={key} className="my-6">
            <img src={imageUrl} alt="" className="w-full rounded" />
            {block.image.caption && block.image.caption.length > 0 && (
              <figcaption className="text-center text-sm text-gray-600 mt-2">
                {renderRichText(block.image.caption)}
              </figcaption>
            )}
          </figure>
        );

      default:
        console.log(`Unsupported block type: ${block.type}`);
        return null;
    }
  };

  const renderRichText = (richTexts: any[]): JSX.Element[] => {
    return richTexts.map((text, index) => {
      const { annotations } = text;
      let element = <span key={index}>{text.plain_text}</span>;

      if (annotations.bold) {
        element = <strong key={index}>{text.plain_text}</strong>;
      }
      if (annotations.italic) {
        element = <em key={index}>{text.plain_text}</em>;
      }
      if (annotations.underline) {
        element = <u key={index}>{text.plain_text}</u>;
      }
      if (annotations.strikethrough) {
        element = <s key={index}>{text.plain_text}</s>;
      }
      if (annotations.code) {
        element = <code key={index} className="bg-gray-100 px-1 rounded">{text.plain_text}</code>;
      }
      if (text.href) {
        element = (
          <a key={index} href={text.href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
            {element}
          </a>
        );
      }

      return element;
    });
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