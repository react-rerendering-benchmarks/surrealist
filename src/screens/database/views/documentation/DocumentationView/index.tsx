import { Group } from "@mantine/core";
import { memo, useMemo, useRef, useState } from "react";
import { useSetting } from "~/hooks/config";
import { useSchema } from "~/hooks/schema";
import { useViewEffect } from "~/hooks/view";
import { buildDocumentation } from "~/screens/database/docs";
import { syncDatabaseSchema } from "~/util/schema";
import { ArticlePane } from "../ArticlePane";
import { TocPane } from "../TopicsPane";

const ArticlePaneLazy = memo(ArticlePane);
const TocPaneLazy = memo(TocPane);

export function DocumentationView() {
	const [language, setLanguage] = useSetting("behavior", "docsLanguage");

	const schema = useSchema();
	const scrollRef = useRef<HTMLDivElement>(null);
	const [active, setActive] = useState("");

	const docs = useMemo(
		() => (schema ? buildDocumentation(schema) : []),
		[schema],
	);

	useViewEffect("documentation", () => {
		syncDatabaseSchema();
	});

	return (
		<>
			<Group h="100%" wrap="nowrap" gap="var(--surrealist-divider-size)">
				<TocPaneLazy
					active={active}
					docs={docs}
					language={language}
					scrollRef={scrollRef}
				/>
				<ArticlePaneLazy
					docs={docs}
					language={language}
					scrollRef={scrollRef}
					onLanguageChange={setLanguage}
					onChangeActiveTopic={setActive}
				/>
			</Group>
		</>
	);
}

export default DocumentationView;
