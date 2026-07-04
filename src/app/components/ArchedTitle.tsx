interface ArchedTitleProps {
  text: string;
}

export function ArchedTitle({ text }: ArchedTitleProps) {
  const letters = text.split("");
  const totalLetters = letters.length;

  return (
    <div className="flex justify-center items-center h-20 relative pt-4">
      {letters.map((letter, index) => {
        // Calculate rotation and position for rainbow arch effect
        const position = index - (totalLetters - 1) / 2;
        const maxPosition = (totalLetters - 1) / 2;

        // Rotation: edges tilt outward
        const rotation = position * 2.5;

        // Height: parabolic curve - middle is highest, edges are lowest
        const normalizedPosition = position / maxPosition; // -1 to 1
        const translateY =
          -(1 - normalizedPosition * normalizedPosition) * 15; // Negative moves up

        return (
          <span
            key={index}
            className="inline-block text-xl"
            style={{
              fontFamily: "Dancing Script, cursive",
              fontSize: "24px",
              transform: `translateY(${translateY}px) rotate(${rotation}deg)`,
              transformOrigin: "center center",
              margin: "0 1px",
              color: "#374151",
              letterSpacing: "0.5px",
            }}
          >
            {letter === " " ? "\u00A0" : letter}
          </span>
        );
      })}
    </div>
  );
}