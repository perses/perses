# Dialog

Dialog is a modal that provides critical information and ask for a decision.

## Usage

```tsx
<Dialog
  isOpen={true}
  title="Delete"
  primaryButton={{ name: 'Delete', onClick: onDelete }}
  secondaryButton={{ name: 'Cancel', onClick: onCancel }}
  onClose={onCancel}
>
  Are you sure?
</Dialog>
```

## Props

| Name            |                                      |
| --------------- | ------------------------------------ |
| isOpen          | if true, the component is shown      |
| children        | the content of the component         |
| onClose         | callback fired when component closes |
| primaryButton   | button for primary action            |
| secondaryButton | button for secondary action          |
