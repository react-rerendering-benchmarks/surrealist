import { lineNumbers } from "@codemirror/view";
import { Paper } from "@mantine/core";
import { surrealql } from "@surrealdb/codemirror";
import { CodeEditor } from "~/components/CodeEditor";
import { SaveBox } from "~/components/SaveBox";
import { surqlLinting, surqlRecordLinks } from "~/editor";
import type { SaveableHandle } from "~/hooks/save";
import { useInspector } from "..";
import classes from "../style.module.scss";

export interface ContentTabProps {
	value: string;
	saveHandle: SaveableHandle;
	onChange: (value: string) => void;
}

export function ContentTab({ value, onChange, saveHandle }: ContentTabProps) {
	const { inspect } = useInspector();

	return (
		<>
			<Paper flex="1 0 0" mih={0} mt="xs" p="xs">
				<CodeEditor
					h="100%"
					value={value}
					onChange={onChange}
					extensions={[
						surrealql(),
						surqlLinting(),
						surqlRecordLinks(inspect),
						lineNumbers(),
					]}
				/>
			</Paper>

			{saveHandle.isChanged && (
				<SaveBox
					handle={saveHandle}
					inline
					inlineProps={{
						className: classes.saveBox,
					}}
				/>
			)}
		</>
	);
}
