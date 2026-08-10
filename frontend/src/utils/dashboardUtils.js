export const normalizeStatus = (value) => {

  if (!value) {
    return "";
  }

  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

};


/* =========================================================
   PARCEL STATISTICS
========================================================= */

export const getParcelStats = (parcels = []) => {

  const total = parcels.length;


  const delivered = parcels.filter(
    (parcel) =>
      normalizeStatus(parcel.status) ===
      "delivered"
  ).length;


  const pending = parcels.filter(
    (parcel) => {

      const status =
        normalizeStatus(
          parcel.status
        );

      return (
        status === "pending" ||
        status === "created" ||
        status === "available"
      );

    }
  ).length;


  const inTransit = parcels.filter(
    (parcel) => {

      const status =
        normalizeStatus(
          parcel.status
        );

      return (
        status === "in_transit" ||
        status === "intransit" ||
        status === "assigned" ||
        status === "out_for_delivery"
      );

    }
  ).length;


  return {
    total,
    delivered,
    pending,
    inTransit,
  };

};


/* =========================================================
   DRIVER STATISTICS
========================================================= */

export const getDriverStats = (drivers = []) => {

  const total = drivers.length;


  const available = drivers.filter(
    (driver) =>
      normalizeStatus(
        driver.status
      ) === "available"
  ).length;


  const busy = drivers.filter(
    (driver) => {

      const status =
        normalizeStatus(
          driver.status
        );

      return (
        status !== "" &&
        status !== "available"
      );

    }
  ).length;


  return {
    total,
    available,
    busy,
  };

};


/* =========================================================
   ASSIGNMENT STATISTICS
========================================================= */

export const getAssignmentStats = (
  assignments = []
) => {

  const total =
    assignments.length;


  const active =
    assignments.filter(
      (assignment) => {

        const status =
          normalizeStatus(
            assignment.status
          );

        return (
          status === "assigned" ||
          status === "active" ||
          status === "in_transit" ||
          status === "intransit" ||
          status === "out_for_delivery" ||
          status === "on_delivery"
        );

      }
    ).length;


  const completed =
    assignments.filter(
      (assignment) => {

        const status =
          normalizeStatus(
            assignment.status
          );

        return (
          status === "completed" ||
          status === "delivered"
        );

      }
    ).length;


  return {
    total,
    active,
    completed,
  };

};


/* =========================================================
   REAL DELIVERY DATA
========================================================= */

export const createWeeklyData = (
  parcels = []
) => {

  const now = new Date();


  const sevenDaysAgo =
    new Date(now);


  sevenDaysAgo.setDate(
    now.getDate() - 6
  );


  sevenDaysAgo.setHours(
    0,
    0,
    0,
    0
  );


  const grouped = {};


  parcels.forEach(
    (parcel) => {

      const status =
        normalizeStatus(
          parcel.status
        );


      if (status !== "delivered") {
        return;
      }


      /*
       * Use the actual timestamp
       * supplied by your database.
       */

      const rawDate =
        parcel.created_at ||
        parcel.updated_at ||
        parcel.pickup_date;


      if (!rawDate) {
        return;
      }


      const date =
        new Date(rawDate);


      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return;
      }


      if (
        date < sevenDaysAgo ||
        date > now
      ) {
        return;
      }


      const key =
        date.toISOString()
          .slice(0, 10);


      if (!grouped[key]) {
        grouped[key] = 0;
      }


      grouped[key] += 1;

    }
  );


  return Object.entries(grouped)

    .sort(
      ([dateA], [dateB]) =>
        new Date(dateA) -
        new Date(dateB)
    )

    .map(
      ([date, delivered]) => ({

        date,

        label:
          new Date(date)
            .toLocaleDateString(
              "en-IN",
              {
                weekday: "short",
                day: "numeric",
              }
            ),

        delivered,

      })
    );

};