import { Alert, Box, Button, Group, Image, Stack, Text } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import type { FC } from "react";
import { adapter } from "~/adapter";
import splashUrl from "~/assets/images/cloud-splash.webp";
import logoDarkUrl from "~/assets/images/dark/cloud-logo.svg";
import logoLightUrl from "~/assets/images/light/cloud-logo.svg";
import { Icon } from "~/components/Icon";
import { useIsLight, useThemeImage } from "~/hooks/theme";
import { useCloudStore } from "~/stores/cloud";
import { useConfigStore } from "~/stores/config";
import type { CloudAlert, CloudPage } from "~/types";
import { useFeatureFlags } from "~/util/feature-flags";
import { iconChevronRight, iconErrorCircle, iconOpen } from "~/util/icons";
import { fetchAPI } from "./api";
import { openCloudAuthentication } from "./api/auth";
import { StatusAlert } from "./components/StatusAlert";
import { BillingPage } from "./pages/Billing";
import { InstancesPage } from "./pages/Instances";
import { MembersPage } from "./pages/Members";
import { PlaceholderPage } from "./pages/Placeholder";
import { ProvisionPage } from "./pages/Provision";
import { SettingsPage } from "./pages/Settings";
import { SupportPage } from "./pages/Support";
import { CloudSidebar } from "./sidebar";
import classes from "./style.module.scss";
import { CloudToolbar } from "./toolbar";

const PAGE_VIEWS: Record<CloudPage, FC> = {
	instances: InstancesPage,
	members: MembersPage,
	audits: PlaceholderPage,
	data: PlaceholderPage,
	billing: BillingPage,
	support: SupportPage,
	settings: SettingsPage,
	provision: ProvisionPage,
};

export function CloudView() {
	const [{ cloud_access }] = useFeatureFlags();
	const isLight = useIsLight();

	const page = useConfigStore((s) => s.activeCloudPage);
	const state = useCloudStore((s) => s.authState);
	const isSupported = useCloudStore((s) => s.isSupported);
	const Content = PAGE_VIEWS[page];

	const showCloud = state === "authenticated" || state === "loading";

	const alertQuery = useQuery({
		queryKey: ["cloud", "message"],
		refetchInterval: 15_000,
		retry: false,
		enabled: state === "authenticated",
		queryFn: () => fetchAPI<CloudAlert>(`/message`),
	});

	const logoUrl = useThemeImage({
		light: logoLightUrl,
		dark: logoDarkUrl,
	});

	const hasAlert = alertQuery.data && Object.keys(alertQuery.data).length > 0;

	return showCloud ? (
		<>
			<Group gap="md" pos="relative" align="center" wrap="nowrap">
				<CloudToolbar />
			</Group>
			<Group flex={1} align="stretch" mt="lg" gap="xl">
				<CloudSidebar />
				<Stack flex={1}>
					{hasAlert && <StatusAlert alert={alertQuery.data} />}
					{Content && <Content />}
				</Stack>
			</Group>
		</>
	) : (
		<>
			<Stack
				gap={38}
				flex={1}
				align="center"
				justify="center"
				style={{ zIndex: 1 }}
				pb={175}
			>
				<Image src={logoUrl} alt="Surreal Cloud" w={500} />
				<Text w={500} fz="lg" ta="center">
					Surreal Cloud redefines the database experience, offering
					the power and flexibility of SurrealDB without the pain of
					managing infrastructure. Elevate your business to
					unparalleled levels of scale and resilience. Focus on
					building tomorrow's applications. Let us take care of the
					rest.
				</Text>
				{!isSupported ? (
					<Alert
						icon={<Icon path={iconErrorCircle} />}
						color={isLight ? "red.6" : "red.5"}
						title="Client update required"
						w={500}
					>
						Please update your version of Surrealist to continue
						using Surreal Cloud.
					</Alert>
				) : cloud_access ? (
					<Group>
						<Button
							w={164}
							color="slate"
							variant="gradient"
							rightSection={<Icon path={iconChevronRight} />}
							onClick={openCloudAuthentication}
						>
							Continue
						</Button>
						<Button
							w={164}
							color="slate"
							variant="light"
							rightSection={<Icon path={iconOpen} />}
							onClick={() =>
								adapter.openUrl("https://surrealdb.com/cloud")
							}
						>
							Learn more
						</Button>
					</Group>
				) : (
					<Button
						w={264}
						color="slate"
						variant="gradient"
						rightSection={<Icon path={iconChevronRight} />}
						onClick={() =>
							adapter.openUrl("https://surrealdb.com/signup")
						}
						style={{
							border: "1px solid rgba(255, 255, 255, 0.3)",
							backgroundOrigin: "border-box",
						}}
					>
						Join the waitlist
					</Button>
				)}
			</Stack>
			<Box
				pos="absolute"
				bottom={-16}
				left={0}
				right={0}
				h={333}
				display="flex"
				style={{
					alignItems: "center",
					justifyContent: "center",
					overflow: "hidden",
				}}
			>
				<Image
					src={splashUrl}
					alt="Surreal Cloud"
					h="100%"
					className={classes.splashImage}
				/>
			</Box>
		</>
	);
}
