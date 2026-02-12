import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Crown, Zap } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  message?: string;
}

const UpgradeModal = ({ open, onClose, message }: UpgradeModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl">Upgrade to Pro</DialogTitle>
          <DialogDescription className="text-center">
            {message || "You've reached your monthly file limit on the Free plan."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <h4 className="font-semibold text-foreground mb-2">Pro Plan Benefits</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                50 files per month (10x more)
              </li>
              <li className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Priority AI processing
              </li>
              <li className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Advanced export options
              </li>
              <li className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Email support
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button className="w-full gap-2" onClick={() => window.open("mailto:support@chattoedit.com?subject=Upgrade to Pro", "_blank")}>
            <Crown className="h-4 w-4" />
            Contact Us to Upgrade
          </Button>
          <Button variant="ghost" className="w-full" onClick={onClose}>
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
