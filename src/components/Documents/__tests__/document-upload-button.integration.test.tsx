import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { act } from 'react';
import { DocumentUploadButton } from '../DocumentUploadButton';

describe('DocumentUploadButton integration', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  test('opens menu with upload option when plus trigger is clicked', () => {
    act(() => {
      root.render(<DocumentUploadButton onUpload={() => {}} />);
    });

    const trigger = container.querySelector('button[title="Add attachment"]') as HTMLButtonElement;
    expect(trigger).toBeTruthy();

    act(() => {
      trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const uploadOption = container.querySelector('button[title="Upload document"]') as HTMLButtonElement;
    expect(uploadOption).toBeTruthy();
    expect(uploadOption.textContent).toContain('Upload document');
  });
});
