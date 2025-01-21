import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { TagInput } from './ui/tag-input';

interface TaskDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDialog({ isOpen, onOpenChange }: TaskDialogProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        // Only allow closing if the tag dropdown is not open
        if (!isTagDropdownOpen) {
          onOpenChange(open);
        }
      }}
    >
      <DialogContent className="sm:max-w-[600px]">
        <DialogTitle>Create Task</DialogTitle>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Tags</div>
            <div className="tag-input">
              <TagInput
                selectedTags={tags}
                onTagsChange={setTags}
                error={errors.tags}
                onDropdownOpenChange={setIsTagDropdownOpen}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
 