import styled from "styled-components";

export const Expanded = styled.div<{padding?: string}>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
  padding: ${(props) => props.padding ?? ""};
`