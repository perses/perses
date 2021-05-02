import { HighlightStyle, tags } from '@codemirror/highlight';

export const promQLLightHighlightMaterialTheme = HighlightStyle.define([
  {
    tag: tags.deleted,
    textDecoration: 'line-through',
  },
  {
    tag: tags.inserted,
    textDecoration: 'underline',
  },
  {
    tag: tags.link,
    textDecoration: 'underline',
  },
  {
    tag: tags.strong,
    fontWeight: 'bold',
  },
  {
    tag: tags.emphasis,
    fontStyle: 'italic',
  },
  {
    tag: tags.invalid,
    color: '#f00',
  },
  {
    tag: tags.keyword,
    color: '#8b44ae',
  },
  {
    tag: tags.operator,
    color: '#5c9ab2',
  },
  {
    tag: tags.atom,
    color: '#F78C6C',
  },
  {
    tag: tags.number,
    color: '#f04b68',
  },
  {
    tag: tags.string,
    color: '#4aa352',
  },
  {
    tag: [tags.escape, tags.regexp],
    color: '#e40',
  },
  {
    tag: tags.definition(tags.variableName),
    color: '#b95c5f',
  },
  {
    tag: tags.labelName,
    color: '#b95c5f',
  },
  {
    tag: tags.typeName,
    color: '#085',
  },
  {
    tag: tags.function(tags.variableName),
    color: '#8b44ae',
  },
  {
    tag: tags.definition(tags.propertyName),
    color: '#00c',
  },
  {
    tag: tags.comment,
    color: '#acb2b3',
  },
]);

export const promQLDarkHighlightMaterialTheme = HighlightStyle.define([
  {
    tag: tags.deleted,
    textDecoration: 'line-through',
  },
  {
    tag: tags.inserted,
    textDecoration: 'underline',
  },
  {
    tag: tags.link,
    textDecoration: 'underline',
  },
  {
    tag: tags.strong,
    fontWeight: 'bold',
  },
  {
    tag: tags.emphasis,
    fontStyle: 'italic',
  },
  {
    tag: tags.invalid,
    color: '#f00',
  },
  {
    tag: tags.keyword,
    color: '#C792EA',
  },
  {
    tag: tags.operator,
    color: '#89DDFF',
  },
  {
    tag: tags.atom,
    color: '#F78C6C',
  },
  {
    tag: tags.number,
    color: '#f04b68',
  },
  {
    tag: tags.string,
    color: '#99b867',
  },
  {
    tag: [tags.escape, tags.regexp],
    color: '#e40',
  },
  {
    tag: tags.definition(tags.variableName),
    color: '#f07178',
  },
  {
    tag: tags.labelName,
    color: '#f07178',
  },
  {
    tag: tags.typeName,
    color: '#085',
  },
  {
    tag: tags.function(tags.variableName),
    color: '#C792EA',
  },
  {
    tag: tags.definition(tags.propertyName),
    color: '#00c',
  },
  {
    tag: tags.comment,
    color: '#8b9296',
  },
]);
