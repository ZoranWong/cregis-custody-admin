import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
  completePasskeyAssertion,
  fetchAuthEntryContext,
  fetchPasskeyAssertionOptions,
} from "@/api/auth";
import { useAuthBootstrapStore } from "@/store/modules/authBootstrap";
import { useUserStore } from "@/store/modules/user";
import { useUiStore } from "@/store/modules/ui";
import { runPasskeyAuthentication } from "@/utils/webauthn";
import { mergeWorkbenchPostAuthRoute } from "@/features/workbench/workbenchEntry";

export type PasskeyState = "loading" | "ready" | "invoking" | "failed" | "unavailable";
export type PasswordRevealState = "collapsed" | "expanded";

export function usePasskeyLogin() {
  const router = useRouter();
  const authBootstrapStore = useAuthBootstrapStore();
  const sessionStore = useUserStore();
  const uiStore = useUiStore();

  const passkeyState = ref<PasskeyState>("loading");
  const passwordRevealState = ref<PasswordRevealState>("collapsed");
  const passwordFallbackAllowed = ref(true);
  const inlineError = ref("");
  const reentryReason = ref("");

  async function loadEntryContext(): Promise<void> {
    try {
      const ctx = await fetchAuthEntryContext();
      if (ctx.passkeyState === "unavailable") {
        passkeyState.value = "unavailable";
      } else if (ctx.passkeyState === "retry_available") {
        passkeyState.value = "failed";
      } else {
        passkeyState.value = "ready";
      }
      passwordFallbackAllowed.value = ctx.allowPasswordFallback;
      if (ctx.reentryReason) {
        reentryReason.value = ctx.reentryReason.message;
      }
    } catch {
      passkeyState.value = "unavailable";
    }
  }

  async function invokePasskey(): Promise<void> {
    inlineError.value = "";
    passkeyState.value = "invoking";
    try {
      const options = await fetchPasskeyAssertionOptions();
      const credential = await runPasskeyAuthentication(options.assertionOptions);
      const result = await completePasskeyAssertion(options.passkeyAttemptId, credential);
      sessionStore.setSession(result.session);
      authBootstrapStore.clearPending();
      authBootstrapStore.setPostAuthRoute(mergeWorkbenchPostAuthRoute(result.postAuthRoute, result.session.user.roles));
      uiStore.showToast("success", "Signed in", "Passkey authentication completed.");
      await router.push({ name: "home" });
    } catch (caught) {
      passkeyState.value = "failed";
      inlineError.value = caught instanceof Error ? caught.message : "Passkey sign-in failed.";
      uiStore.showToast("error", "Passkey failed", inlineError.value);
    }
  }

  function revealPassword(): void {
    if (!passwordFallbackAllowed.value) {
      return;
    }
    passwordRevealState.value = "expanded";
    passkeyState.value = "ready";
  }

  function hidePassword(): void {
    passwordRevealState.value = "collapsed";
    inlineError.value = "";
  }

  onMounted(() => {
    void loadEntryContext();
  });

  return {
    passkeyState,
    passwordRevealState,
    passwordFallbackAllowed,
    inlineError,
    reentryReason,
    invokePasskey,
    revealPassword,
    hidePassword,
  };
}
