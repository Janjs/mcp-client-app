import React from "react";
import { ModelList } from "./components/ModelList";

/**
 * Models Management Page
 *
 * Main page for managing AI model providers and models
 */
export const ModelsManagement: React.FC = () => {
  return (
    <div className="p-6">
      <ModelList />
    </div>
  );
};
