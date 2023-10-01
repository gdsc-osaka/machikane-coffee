import styled from "styled-components";

export const Row = styled.div<{gap?: string}>`
  display: flex;
  align-items: center;
  gap: ${(props) => props.gap ?? "0.5rem"};
`