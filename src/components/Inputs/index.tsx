import classes from "./style.module.scss";
import clsx from "clsx";
import { surrealql } from "@surrealdb/codemirror";
import { ActionIcon, Autocomplete, AutocompleteProps, Group, InputBase, InputBaseProps, Pill, PillsInput, PillsInputProps, Tooltip } from "@mantine/core";
import { HTMLAttributes, KeyboardEvent, useEffect, useMemo, useRef } from "react";
import { Icon } from "~/components/Icon";
import { useIsLight } from "~/hooks/theme";
import { useStable } from "~/hooks/stable";
import { useKindList } from "~/hooks/schema";
import { iconCancel, iconCheck } from "~/util/icons";
import { EditorView, keymap, placeholder as ph } from "@codemirror/view";
import { Compartment, EditorState, Extension, Prec } from "@codemirror/state";
import { acceptWithTab, inputBase, colorTheme } from "~/editor";
import { useInputState } from "@mantine/hooks";

export interface CodeInputProps extends InputBaseProps, Omit<HTMLAttributes<HTMLDivElement>, 'style'|'value'|'onChange'> {
	value: string;
	autoFocus?: boolean;
	placeholder?: string;
	extensions?: Extension;
	onChange: (value: string) => void;
	onMount?: (editor: EditorView) => void;
	onSubmit?: () => void;
}

export function CodeInput({
	value,
	autoFocus,
	extensions,
	disabled,
	multiline,
	className,
	placeholder,
	onChange,
	onMount,
	onSubmit,
	...rest
}: CodeInputProps) {
	const isLight = useIsLight();
	const ref = useRef<HTMLDivElement | null>(null);
	const editorRef = useRef<{
		editor: EditorView;
		editable: Compartment;
		fallback: Compartment;
		keymaps: Compartment;
		theme: Compartment;
	}>();

	useEffect(() => {
		const editable = new Compartment();
		const fallback = new Compartment();
		const keymaps = new Compartment();
		const theme = new Compartment();

		const editableExt = editable.of(EditorState.readOnly.of(!!disabled));
		const fallbackExt = fallback.of(placeholder ? ph(placeholder) : []);
		const keymapsExt = keymaps.of([]);

		const changeHandler = EditorView.updateListener.of((update) => {
			if (update.docChanged) {
				onChange?.(update.state.doc.toString());
			}
		});

		const initialState = EditorState.create({
			doc: value,
			extensions: [
				inputBase(),
				colorTheme(isLight),
				extensions || surrealql(),
				changeHandler,
				editableExt,
				fallbackExt,
				keymapsExt,
			]
		});

		const editor = new EditorView({
			state: initialState,
			parent: ref.current!,
		});

		editorRef.current = {
			editor,
			editable,
			fallback,
			keymaps,
			theme,
		};

		if (autoFocus) {
			const timer = setInterval(() => {
				editor.focus();
				if(editor.hasFocus) clearInterval(timer);
			}, 50);
		}

		onMount?.(editor);

		return () => {
			editor.destroy();
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		const { editor } = editorRef.current!;

		if (value == editor.state.doc.toString()) {
			return;
		}

		const transaction = editor.state.update({
			changes: {
				from: 0,
				to: editor.state.doc.length,
				insert: value
			},
			effects: [
				EditorView.scrollIntoView(0)
			]
		});

		editor.dispatch(transaction);
	}, [value]);

	useEffect(() => {
		const { editor, editable } = editorRef.current!;
		const editableExt = EditorState.readOnly.of(!!disabled);

		editor.dispatch({
			effects: editable.reconfigure(editableExt)
		});
	}, [disabled]);

	useEffect(() => {
		const { editor, fallback } = editorRef.current!;
		const fallbackExt = placeholder ? ph(placeholder) : [];

		editor.dispatch({
			effects: fallback.reconfigure(fallbackExt)
		});
	}, [placeholder]);

	useEffect(() => {
		const { editor, keymaps } = editorRef.current!;
		const value = Prec.highest(keymap.of(multiline ? [acceptWithTab] : [{
			key: 'Enter',
			run: () => {
				onSubmit?.();
				return true;
			}
		}]));

		editor.dispatch({
			effects: keymaps.reconfigure(value)
		});
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [multiline]);

	useEffect(() => {
		const { editor, theme } = editorRef.current!;

		editor.dispatch({
			effects: theme.reconfigure(colorTheme(isLight))
		});
	}, [isLight]);

	return (
		<InputBase
			ref={ref}
			component="div"
			multiline
			className={clsx(classes.codeInput, className)}
			disabled={disabled}
			{...rest}
		/>
	);
}

export function PermissionInput({
	value,
	onChange,
	...rest
}: Omit<CodeInputProps, 'value'|'onChange'> & {
	value: string | boolean;
	onChange: (value: string | boolean) => void;
}) {
	const textValue = useMemo(() => {
		if (value === true) {
			return "FULL";
		} else if (value === false) {
			return "NONE";
		} else {
			return value;
		}
	}, [value]);

	const handleChange = useStable((value: string) => {
		if (value === "FULL" || value === "true") {
			onChange(true);
		} else if (value === "NONE" || value === "false") {
			onChange(false);
		} else {
			onChange(value);
		}
	});

	return (
		<CodeInput
			placeholder="WHERE user = $auth.id"
			multiline
			value={textValue}
			onChange={handleChange}
			rightSectionWidth={70}
			extensions={[surrealql('permission')]}
			rightSection={
				<Group gap="xs">
					<Tooltip label="Grant full access">
						<ActionIcon
							color="green.4"
							onClick={() => onChange("FULL")}
							variant={textValue.toUpperCase() === "FULL" ? "light" : "subtle"}
							aria-label="Grant full access"
						>
							<Icon path={iconCheck} />
						</ActionIcon>
					</Tooltip>
					<Tooltip label="Reject all access">
						<ActionIcon
							color="pink.6"
							onClick={() => onChange("NONE")}
							variant={textValue.toUpperCase() === "NONE" ? "light" : "subtle"}
							aria-label="Reject all access"
						>
							<Icon path={iconCancel} />
						</ActionIcon>
					</Tooltip>
				</Group>
			}
			{...rest}
		/>
	);
}

export interface FieldKindInputProps extends AutocompleteProps {
	value: string;
	onChange: (value: string) => void;
}

export function FieldKindInput({
	className,
	...rest
}: FieldKindInputProps) {
	const kinds = useKindList();

	return (
		<Autocomplete
			data={kinds}
			spellCheck={false}
			className={clsx(classes.input, classes.kindInput, className)}
			{...rest}
		/>
	);
}

export interface EmailInputProps extends Omit<PillsInputProps, 'value' | 'onChange'> {
	value: string[];
	onChange: (value: string[]) => void;
}

export function EmailInput({
	value,
	onChange,
	autoFocus,
	...other
}: EmailInputProps) {
	const [draft, setDraft] = useInputState("");
	const isValid = !draft || draft.includes('@');
	const isLight = useIsLight();

	const handleSubmit = useStable(() => {
		if (!draft || !isValid) return;

		if (!value.includes(draft)) {
			onChange([...value, draft]);
		}

		setDraft("");
	});

	const handleKey = useStable((e: KeyboardEvent) => {
		if ((e.code === "Enter" || e.code == "Space") && draft) {
			handleSubmit();
			e.preventDefault();
		} else if (e.code === "Backspace" && !draft && value.length > 0) {
			onChange?.(value!.slice(0, -1));
		}
	});

	return (
		<PillsInput
			{...other}
			error={!isValid}
		>
			<Pill.Group mih={22}>
				{value.map((email, i) => (
					<Pill
						key={i}
						withRemoveButton
						onRemove={() => onChange?.(value!.filter((_, j) => i !== j))}
						bg={isLight ? "slate.1" : "slate.9"}
					>
						{email}
					</Pill>
				))}
				<PillsInput.Field
					placeholder="Enter email addresses..."
					autoFocus={autoFocus}
					value={draft}
					onChange={setDraft}
					onBlur={handleSubmit}
					onKeyDown={handleKey}
				/>
			</Pill.Group>
		</PillsInput>
	);
}
