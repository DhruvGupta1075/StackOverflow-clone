import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle2, Lock, Sparkles, Award } from "lucide-react";

interface PrivilegeItem {
  key: string;
  minRep: number;
  name: string;
  description: string;
}

const PRIVILEGE_LIST: PrivilegeItem[] = [
  {
    key: "comment_unrestricted",
    minRep: 50,
    name: "Comment without restrictions",
    description: "Comment freely on questions, answers, and community posts.",
  },
  {
    key: "edit_posts",
    minRep: 100,
    name: "Edit community posts",
    description: "Suggest edits and refine community posts and questions.",
  },
  {
    key: "vote_close",
    minRep: 250,
    name: "Vote to close questions",
    description: "Help moderate by voting to close duplicate or off-topic questions.",
  },
  {
    key: "report_content",
    minRep: 500,
    name: "Report inappropriate content",
    description: "Flag inappropriate, spam, or guideline-violating content for admin review.",
  },
];

interface ReputationPrivilegeNoticeProps {
  currentReputation: number;
  communityRank: string;
}

export const ReputationPrivilegeNotice: React.FC<ReputationPrivilegeNoticeProps> = ({
  currentReputation,
  communityRank,
}) => {
  return (
    <Card className="border border-orange-200 bg-gradient-to-br from-orange-50/30 to-white shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-600" /> Community Privileges
          </CardTitle>

          <Badge className="bg-orange-100 text-orange-800 border-orange-300 font-semibold flex items-center gap-1">
            <Award className="w-3.5 h-3.5" /> Rank: {communityRank}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PRIVILEGE_LIST.map((priv) => {
            const isUnlocked = currentReputation >= priv.minRep;
            return (
              <div
                key={priv.key}
                className={`p-3 rounded-lg border transition ${
                  isUnlocked
                    ? "bg-green-50/50 border-green-200"
                    : "bg-gray-50 border-gray-200 opacity-80"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm text-gray-900 flex items-center gap-1.5">
                    {isUnlocked ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                    {priv.name}
                  </span>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] ${
                      isUnlocked ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {priv.minRep} Rep
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{priv.description}</p>
                {!isUnlocked && (
                  <p className="text-[11px] text-orange-700 mt-1.5 font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-orange-500" /> Needs {priv.minRep - currentReputation} more reputation
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
