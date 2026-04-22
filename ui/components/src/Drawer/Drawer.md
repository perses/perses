# Drawer

Drawer provides supplementary content that are anchored to the left or right edge of the screen.

## Usage

```tsx
<Drawer isOpen={true} onClose={onClose}>
  <div>More info...</div>
</Drawer>
```

## Props

| Name     |                                                   |
|----------|---------------------------------------------------|
| isOpen   | if true, the component is shown                   |
| children | the content of the component                      |
| onClose  | callback fired when component closes              |
| anchor   | [optional] side from which the drawer will appear |
