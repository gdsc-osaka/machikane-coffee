import React from 'react';
import styled from 'styled-components'

const StyledTimeDisplay = styled.div`
	color: ${({ textColor }) => textColor ? textColor : `#333`};
    text-align: center;
	font-family: 'Share Tech Mono', monospace;
	font-weight: bold;
	font-size: ${({ fontSize }) => fontSize ? fontSize : '1em'};
`;

const TimeDisplay = ({ className, time, delimiter, fontSize }) => {
	const newTime = Array.isArray(time) ? time : Object.values(time)

	return (
		<StyledTimeDisplay
			className={className}
			fontSize={fontSize}
		>
			{
				newTime.map((n, i, array) => (
					<>
            {/* padStartは文字列のメソッドであるため、Stringでnを文字列に変換 */}
						<span>{String(n).padStart(2, "0")}</span>

            {/* 末尾の区切り文字は表示しない */}
						{(i !== array.length - 1) && delimiter}
					</>
				))
			}
		</StyledTimeDisplay>
	);
};

export default TimeDisplay