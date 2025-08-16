"use client";

import dynamic from "next/dynamic";
import { ExtendedRecordMap } from "notion-types";
import { FC } from "react";

// Import core styles
import "react-notion-x/src/styles.css";

// Dynamic imports for code highlighting and math
const Code = dynamic(() =>
  import("react-notion-x/build/third-party/code").then((m) => m.Code),
  { ssr: false }
);

const Collection = dynamic(() =>
  import("react-notion-x/build/third-party/collection").then((m) => m.Collection),
  { ssr: false }
);

const Equation = dynamic(() =>
  import("react-notion-x/build/third-party/equation").then((m) => m.Equation),
  { ssr: false }
);

const NotionRendererComponent = dynamic(
  () => import("react-notion-x").then((m) => m.NotionRenderer),
  { ssr: false }
);

interface NotionRendererProps {
  recordMap: ExtendedRecordMap;
  fullPage?: boolean;
  darkMode?: boolean;
}

export const NotionRenderer: FC<NotionRendererProps> = ({
  recordMap,
  fullPage = false,
  darkMode = false,
}) => {
  return (
    <div className="notion-container">
      <style jsx global>{`
        .notion-container {
          font-family: inherit;
        }
        
        .notion-container .notion {
          font-family: inherit;
        }
        
        .notion-container .notion-page {
          padding: 0;
          width: 100%;
        }
        
        .notion-container .notion-title {
          display: none;
        }
        
        .notion-container .notion-header {
          display: none;
        }
        
        .notion-container .notion-page-cover {
          display: none;
        }
        
        .notion-container .notion-page-icon-wrapper {
          display: none;
        }
        
        .notion-container .notion-collection-header {
          display: none;
        }
        
        .notion-container .notion-h {
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        
        .notion-container .notion-h1 {
          font-size: 2rem;
          font-weight: 700;
        }
        
        .notion-container .notion-h2 {
          font-size: 1.5rem;
          font-weight: 600;
        }
        
        .notion-container .notion-h3 {
          font-size: 1.25rem;
          font-weight: 600;
        }
        
        .notion-container .notion-text {
          margin: 0.5rem 0;
          line-height: 1.7;
        }
        
        .notion-container .notion-code {
          background: #f5f5f5;
          border: 1px solid #e5e5e5;
          border-radius: 0.375rem;
        }
        
        .notion-container .notion-callout {
          border-radius: 0.5rem;
          padding: 1rem;
          margin: 1rem 0;
        }
        
        .notion-container .notion-bookmark {
          border: 1px solid #e5e5e5;
          border-radius: 0.5rem;
          padding: 1rem;
          margin: 1rem 0;
        }
        
        .notion-container .notion-quote {
          border-left: 3px solid #e5e5e5;
          padding-left: 1rem;
          margin: 1rem 0;
        }
        
        .notion-container .notion-divider {
          border-bottom: 1px solid #e5e5e5;
          margin: 2rem 0;
        }
      `}</style>
      <NotionRendererComponent
        recordMap={recordMap}
        fullPage={fullPage}
        darkMode={darkMode}
        components={{
          Code,
          Collection,
          Equation,
        }}
      />
    </div>
  );
};