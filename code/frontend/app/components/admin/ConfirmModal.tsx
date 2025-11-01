"use client";
import { Badge, Button, Checkbox, Group, Modal, Stack, Text } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useState } from "react";

export default function ConfirmModal({
  opened,
  onClose,
  product,
  fileName,
  onConfirm,              
  loading,
}: {
  opened: boolean;
  onClose: () => void;
  product: string | null;
  fileName?: string;
  onConfirm: () => Promise<void> | void; 
  loading?: boolean;
}) {
  const [ack, setAck] = useState(false);

  async function handleConfirmClick() {
    if (!ack || loading) return;
    await onConfirm();     
    setAck(false);         
  }

  return (
    <Modal
      opened={opened}
      onClose={() => { setAck(false); onClose(); }}
      centered
      radius="lg"
      size="sm"
      withCloseButton={!loading}                 
      title={
        <Group gap="xs">
          <IconAlertTriangle size={18} color="var(--mantine-color-red-6)" />
          <Text fw={600}>Send and overwrite rules?</Text>
        </Group>
      }
      overlayProps={{ blur: 2, opacity: 0.35 }}
      closeOnEscape={!loading}
      closeOnClickOutside={false}
      trapFocus
    >
      <Stack gap="sm">
        <Group gap="xs" wrap="wrap">
          <Text size="sm" c="dimmed">Product:</Text>
          <Badge variant="light">{product ?? "—"}</Badge>
          {fileName && (
            <>
              <Text size="sm" c="dimmed">File:</Text>
              <Badge variant="light">{fileName}</Badge>
            </>
          )}
        </Group>

        <Checkbox
          checked={ack}
          onChange={(e) => setAck(e.currentTarget.checked)}
          label="I understand this will overwrite the current rules"
          radius="sm"
          disabled={!!loading}
        />

        <Group grow gap="sm" mt="md" w="100%">
          <Button
            variant="default"
            onClick={() => { setAck(false); onClose(); }}
            disabled={!!loading}
          >
            Cancel
          </Button>
          <Button
            color="red"
            disabled={!ack || !!loading}
            loading={!!loading}
            onClick={handleConfirmClick}        
          >
            Send & overwrite
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
