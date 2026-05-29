"use client";

import { useRouter } from "next/navigation";

import membershipStyles from "./membership-form.module.css";

interface DeleteMemberButtonProps {
  membershipId: string;
  returnTo: string;
  memberName: string;
}

export function DeleteMemberButton({
  membershipId,
  returnTo,
  memberName,
}: DeleteMemberButtonProps) {
  const router = useRouter();

  const handleDelete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const confirmed = confirm(
      `Are you sure you want to remove ${memberName} from this workspace? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    const formData = new FormData();
    formData.append("membership_id", membershipId);
    formData.append("return_to", returnTo);

    try {
      const response = await fetch("/workspace/delete-member", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        router.refresh();
      } else {
        const error = await response.text();
        alert(`Failed to remove member: ${error}`);
      }
    } catch (error) {
      alert(`Failed to remove member: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <form onSubmit={handleDelete} style={{ display: "inline" }}>
      <button
        type="submit"
        className={membershipStyles.removeButton}
      >
        Remove
      </button>
    </form>
  );
}