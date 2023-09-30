import styled from "styled-components";

export const Column = styled.div<{minWidth?: string}>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1.5rem;
  align-self: stretch;
  min-width: ${(props) => props.minWidth ?? 0};
`