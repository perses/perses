# Info Tooltip

Info tooltip displays informative text when users hover over, focus on, or tap an element.

## Usage

```tsx
<InfoTooltip title={'tooltip title'} description={'tooltip description'}>
  <p>What is this tooltip?</div>
</InfoTooltip>
```

## Props

| Name        |                                                                                               |
| ----------- | --------------------------------------------------------------------------------------------- | --- |
| description | informative text in the tooltip                                                               |
| children    | the element with the tooltip                                                                  |
| id          | [optional] used to help implement the accessibility logic. default is a randomly generated id |     |
| title       | [optional] title of the tooltip content                                                       |
| placement   | [optional] placement of the tooltip. default is bottom                                        |
