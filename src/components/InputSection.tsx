import React from 'react';

interface InputSectionProps {
  itemId: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const InputSection: React.FC<InputSectionProps> = ({ itemId, inputRef, handleInputChange, handleKeyDown }) => (
  <div style={{
    backgroundColor: '#faf8f5',
    border: '3px solid #000',
    padding: '30px',
    marginBottom: '40px'
  }}>
    <input
      ref={inputRef}
      type="text"
      value={itemId}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      placeholder="SCANNA ELLER SKRIV IN ARTIKEL ID..."
      autoFocus
      style={{
        width: '100%',
        padding: '15px 20px',
        fontSize: '18px',
        fontFamily: '"Courier New", monospace',
        border: '3px solid #000',
        backgroundColor: '#faf8f5',
        color: '#000',
        outline: 'none',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        textAlign: 'center'
      }}
    />
  </div>
);

export default InputSection;
