import { useAccounts } from "@/contexts/AccountsContext";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import CreateAccount from "@/components/LinkedAccounts/CreateAccount";
import { useState } from "react";

export default function CreateAssetMessage() {
    const { accounts } = useAccounts();
    const [open, setOpen] = useState(false);
    //Change THIS FOR DEMO PURPOSES (there is 3 dummy accounts added by default)
    if (accounts.length === 3) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-lg border-muted">
                    <PlusCircle className="w-12 h-12 mb-4 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-semibold">No Assets Added</h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                        Add your first asset to start tracking your wealth and transactions
                    </p>
                    <DialogTrigger asChild>
                        <Button>Add Your First Asset</Button>
                    </DialogTrigger>
                </div>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add New Asset</DialogTitle>
                    </DialogHeader>
                    <CreateAccount />
                    <DialogClose data-dialog-close className="hidden" />
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="flex items-center gap-2"
                >
                    <PlusCircle className="w-4 h-4" />
                    Add Asset
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Asset</DialogTitle>
                </DialogHeader>
                <CreateAccount />
                <DialogClose data-dialog-close className="hidden" />
            </DialogContent>
        </Dialog>
    );
} 