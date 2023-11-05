import styled from "styled-components";

const SimpleGrid = styled.div<{ column: number }>`
  display: grid;
  grid-template-columns: ${props => '1fr '.repeat(props.column)};
  gap: 2rem;
`

export default SimpleGrid;