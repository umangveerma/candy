import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import { toDate, formatNumber } from "../../utils";
import * as anchor from "@project-serum/anchor";
import { CandyMachineAccount } from "../../lib/candy-machine";
import {MintCountdown} from '../MintCountdown';
interface Props {
    candyMachine?: CandyMachineAccount;
    discountPrice?:anchor.BN;
    itemsRemaining?: number;
    endDate?: Date;
    isWhitelistUser: boolean;
    isActive: boolean;
    isPresale: boolean;
    setIsActive: Function;
    setIsPresale: Function;
}
const CandyMachineInfo = (props: Props) => {
  const {
    candyMachine,
    itemsRemaining,
    isWhitelistUser,
    discountPrice,
    isActive,
    isPresale,
    setIsActive,
    setIsPresale,
    endDate,
  } = props;

  const toggleMintButton = () => {
    let active = !isActive || isPresale;

    if (active) {
      if (candyMachine!.state.isWhitelistOnly && !isWhitelistUser) {
        active = false;
      }
      if (endDate && Date.now() >= endDate.getTime()) {
        active = false;
      }
    }

    if (
      isPresale &&
      candyMachine!.state.goLiveDate &&
      candyMachine!.state.goLiveDate.toNumber() <= new Date().getTime() / 1000
    ) {
      setIsPresale((candyMachine!.state.isPresale = false));
    }

    setIsActive((candyMachine!.state.isActive = active));
  };
  const getCountdownDate = (
    candyMachine: CandyMachineAccount
  ): Date | undefined => {
    if (
      candyMachine.state.isActive &&
      candyMachine.state.endSettings?.endSettingType.date
    ) {
      return toDate(candyMachine.state.endSettings.number);
    }

    return toDate(
      candyMachine.state.goLiveDate
        ? candyMachine.state.goLiveDate
        : candyMachine.state.isPresale
        ? new anchor.BN(new Date().getTime() / 1000)
        : undefined
    );
  };
  return (
    <Grid container direction="row" justifyContent="center" wrap="nowrap">
      <Grid item xs={3}>
        <Typography variant="body2" color="textSecondary">
          Remaining
        </Typography>
        <Typography
          variant="h6"
          color="textPrimary"
          style={{
            fontWeight: "bold",
          }}
        >
          {`${itemsRemaining}`}
        </Typography>
      </Grid>
      <Grid item xs={4}>
        <Typography variant="body2" color="textSecondary">
          {isWhitelistUser && discountPrice ? "Discount Price" : "Price"}
        </Typography>
        <Typography
          variant="h6"
          color="textPrimary"
          style={{ fontWeight: "bold" }}
        >
          {isWhitelistUser && discountPrice
            ? `◎ ${formatNumber.asNumber(discountPrice)}`
            : `◎ ${formatNumber.asNumber(candyMachine?.state.price)}`}
        </Typography>
      </Grid>
      <Grid item xs={5}>
        {isActive && endDate && Date.now() < endDate.getTime() ? (
          <>
            <MintCountdown
              key="endSettings"
              date={getCountdownDate((candyMachine) as CandyMachineAccount)}
              style={{ justifyContent: "flex-end" }}
              status="COMPLETED"
              onComplete={toggleMintButton}
            />
            <Typography
              variant="caption"
              align="center"
              display="block"
              style={{ fontWeight: "bold" }}
            >
              TO END OF MINT
            </Typography>
          </>
        ) : (
          <>
            <MintCountdown
              key="goLive"
              date={getCountdownDate((candyMachine) as CandyMachineAccount)}
              style={{ justifyContent: "flex-end" }}
              status={
                candyMachine?.state?.isSoldOut ||
                (endDate && Date.now() > endDate.getTime())
                  ? "COMPLETED"
                  : isPresale
                  ? "PRESALE"
                  : "LIVE"
              }
              onComplete={toggleMintButton}
            />
            {isPresale &&
              candyMachine?.state.goLiveDate &&
              candyMachine?.state.goLiveDate.toNumber() >
                new Date().getTime() / 1000 && (
                <Typography
                  variant="caption"
                  align="center"
                  display="block"
                  style={{ fontWeight: "bold" }}
                >
                  UNTIL PUBLIC MINT
                </Typography>
              )}
          </>
        )}
      </Grid>
    </Grid>
  );
};

export default CandyMachineInfo;
