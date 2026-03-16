import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const DisclaimerPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="px-5 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-foreground mb-4"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <p className="text-xs text-muted-foreground mb-1">Hello !</p>
        <h1 className="text-xl font-bold text-foreground mb-6">
          Sam Oberoi
        </h1>

        <h2 className="text-2xl font-bold text-foreground mb-4">
          Disclaimer of Liability
        </h2>

        <div className="space-y-4 text-sm text-foreground leading-relaxed">
          <p>
            The diaForm process developed by PreciseDM, LLC is intended only for use by trained medical
            professionals. While the diaForm process will provide a recommended insulin dosage range,
            users should consult closely with appropriate medical professionals, including treating
            physicians, to confirm any recommended dosage is appropriate for a particular patient.
          </p>

          <p>
            PreciseDM, LLC shall not be held liable for any improper or incorrect use of the diaForm
            product (including any error in inputting data or interpreting of the information described and/
            or contained therein and assumes no responsibility for anyone's use of the information.
          </p>

          <p>
            In no event shall PreciseDM, LLC or its contributors be liable for any direct, indirect,
            incidental, special, exemplary, or consequential damages (including, but not limited to,
            procurement of substitute goods or services; loss of use, data, or profits; or business
            interruption) however caused on any theory of liability, whether in contract, strict liability,
            tort (including negligence or otherwise), or any other theory arising in any way out of the use
            of this system, even if advised of the possibility of such damage. This disclaimer of liability
            applies to any damages or injury, whether based on alleged breach of contract, tortious
            behavior, negligence or any other cause of action, including but not limited to damages or
            injuries caused by or resulting from any failure of performance, error, omission, interruption,
            deletion, defect, delay in operation or transmission, computer virus, communication line
            failure, and/or theft, destruction or unauthorized access to, alteration of, or use of any
            record.
          </p>

          <h3 className="text-xl font-bold text-foreground pt-2">Indemnification</h3>

          <p>
            User agrees to defend, indemnify, and hold harmless, PreciseDM, LLC, its contributors, any
            entity jointly created by them, their respective affiliates and their respective directors, officers,
            employees, and agents from and against all claims and expenses, including attorneys' fees,
            arising out of the use of the diaForm process by user or user's account.
          </p>

          <h3 className="text-xl font-bold text-foreground pt-2">
            Disclaimer of Warranties/Accuracy and Use of Data/Computer Viruses
          </h3>

          <p>
            Although the data contained in or produced by the diaForm process has been produced and
            processed from sources believed to be reliable, no warranty, expressed or implied, is made
            regarding accuracy, adequacy, completeness, legality, reliability, or usefulness of any
            information. User should rely upon its own independent medical training and experience
            when using the diaForm process.
          </p>

          <p>
            This disclaimer applies to both isolated and aggregate uses of the information. PreciseDM,
            LLC provides this information on an "AS IS" basis. All warranties of any kind, whether
            express or implied, including but not limited to the implied warranties of merchantability,
            fitness for a particular purpose, freedom from contamination by computer viruses, and non-
            infringement of proprietary rights are disclaimed to the greatest extent permitted by
            law.
          </p>

          <p>
            Changes may be periodically added to the information herein; these changes may or may
            not be incorporated in any new version of the publication. If the user has obtained
            information from the diaForm process from a source other than PreciseDM, LLC itself, the
            user must be aware that electronic data can be altered subsequent to original distribution.
            Data can also quickly become out-of-date. It is recommended that the user pay careful
            attention to the contents of any data or information associated with a file, and that the
            originator of the data or information be contacted with any questions regarding appropriate
            use. If the user finds any errors or omissions, we encourage the user to report them to
            PreciseDM, LLC.
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default DisclaimerPage;
