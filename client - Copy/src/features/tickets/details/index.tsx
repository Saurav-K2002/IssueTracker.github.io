    async function refetchTicketDetails(ticket: Ticket) {
      store.dispatch(fetchTicketById(ticket._id));
    }

    if (ticket) refetchTicketDetails(ticket);
  }, [ticket?._id]);

  useEffect(() => {
    // If ticket is deleted, close the details bar
    if (!ticketDetails.ticket && !ticketDetails.loading) {
      setOpen(false);
    }
  }, [ticketDetails.ticket]);

  useEffect(() => {
    const commentSection = commentsRef?.current as HTMLDivElement | null;
    if (commentSection) {
      // Scroll to bottom of comments section when new comment is added
      commentSection.scrollTop = commentSection.scrollHeight;
    }
  }, [ticketDetails.ticket?.comments]);

  const handleCommentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (comment.trim() && !ticketDetails.method.comment) {
      const ticket = ticketDetails.ticket!;
      store.dispatch(commentOnTicket(ticket._id, comment));
      setComment("");
    }
  };

  const isCommentAuthorized = useMemo(() => {
    return Authorized(
      "ticket",
      "comment-create",
      user,
      project,
      ticketDetails.ticket
    );
  }, [user, ticketDetails.ticket]);

  return (
    <aside
      className={`bg-gray-850 fixed top-16 w-screen right-0 bottom-[60px] border-gray-700 lg:absolute lg:top-0 lg:w-80 lg:h-full lg:border-l z-50 ${
        open ? "translate-x-0" : "translate-x-full"
      } transition-all`}
    >
      <div className="relative h-full flex flex-col">
        <header className="flex gap-2 p-3 border-b border-gray-700 max-w-full">
          <span
            className={`p-1 m-1 rounded-full h-fit w-fit ${
              ticket?.status === "closed"
                ? "bg-red-500 text-red-50"
                : "bg-blue-500 text-blue-50"
            }`}
          >
            {ticket?.status === "closed" ? (
              <IoMdClose className="text-lg" id="ticket-status-icon-closed" />
            ) : (
              <BsCheck className="text-lg" id="ticket-status-icon-open" />
            )}
            <Tooltip
              anchorId="ticket-status-icon-opened"
              content="Opened ticket"
              place="bottom"
            />
            <Tooltip
              anchorId="ticket-status-icon-closed"
              content="Closed ticket"
              place="bottom"
            />
          </span>
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            <h2 className="font-semibold text-gray-100 text-lg truncate">
              {ticket?.title}
            </h2>
            <p className="text-sm text-gray-500 font-semibold truncate">
              <span>{`Created ${getDate(ticket?.createdAt, {
                format: "on calendar",
              })}`}</span>
            </p>
          </div>
          <button
            name="close modal"
            className="p-1 text-2xl text-gray-500 ring-1 ring-gray-500 hover:text-gray-300 hover:ring-gray-300 rounded-full transition-all focus:outline-none active:bg-gray-700 h-fit"
            onClick={() => {
              setOpen(false);
            }}
          >
            <IoMdClose />
          </button>
        </header>

        {ticketDetails.loading && ticketDetails.method.details ? (
          <div className="p-3 aspect-square grid place-items-center">
            <div className="flex flex-col items-center gap-2">
              {" "}
              <TailSpinLoader color="orange" width={50} height={50} />
              <p className="text-ss">Loading details...</p>{" "}
            </div>
          </div>
        ) : (
          <div className="text-ss text-gray-100 flex-1 flex flex-col">
            <div className="ticket-content p-3 border-b border-gray-700">
              {/* Time estimate */}
              <h3 className="font-semibold text-sm text-gray-300 mb-4">
                <span className="uppercase text-orange-400">
                  Time estimated
                </span>
                :{" "}
                <Pluralize
                  singular="hour"
                  count={ticketDetails.ticket?.time_estimate}
                />
              </h3>

              {/* Description */}
              <h3 className="font-semibold text-sm text-gray-400">
                Description
              </h3>
              <p className="line-clamp-5">
                {returnWithLineBreaks(ticketDetails.ticket?.description)}
              </p>
            </div>

            <div className="ticket-comments flex flex-col gap-2 flex-1 mb-[62px] relative isolate">
              <header className="h-12 px-3 flex items-center bg-gray-900 z-50">
                <h3 className="font-semibold">Comments</h3>
              </header>
              <div className="absolute top-12 left-0 w-full bottom-0 z-10">
                <div
                  className="comments-container relative flex flex-col h-full overflow-y-scroll"
                  ref={commentsRef}
                >
                  <TicketComments
                    comments={ticketDetails.ticket?.comments || []}
                  />
                </div>
                {isCommentAuthorized ? (
                  <form onSubmit={handleCommentSubmit}>
                    <input
                      className="absolute bottom-2 w-[calc(100%-1.5rem)] left-3 rounded-sm bg-gray-900 outline-none px-3 py-2 shadow-sm text-sm text-white font-medium placeholder:text-gray-300 font-noto"
                      type="text"
                      value={comment}
                      onChange={(e) => {
                        setComment(e.target.value);
                      }}
                      placeholder="Comment here"
                    />
                  </form>
                ) : (
                  <div className="absolute bottom-2 w-[calc(100%-1.5rem)] left-3 bg-gray-900 rounded hover:cursor-text text-gray-300 font-noto font-medium text-sm select-none overflow-hidden group">
                    <div className="relative px-3 py-2">
                      Comment here
                      <p className="absolute inset-0 bg-gray-900/50 backdrop-blur flex px-3 py-2 opacity-0 group-hover:opacity-100 transition-all truncate">
                        <FcCancel className="text-lg mr-1" /> Only ticket
                        members can comment
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="buttons p-3 absolute bottom-0 left-0 w-full border-t border-gray-700 flex gap-2 bg-gray-825">
          <button
            className="bg-blue-500 flex justify-center p-2 text-ss font-semibold rounded text-blue-50 hover:bg-blue-600 disabled:opacity-75 disabled:cursor-not-allowed transition-colors flex-1"
            disabled={
              ticketDetails.loading ||
              ticketDetails.method.update ||
              ticketDetails.ticket?.status === "closed" ||
              !Authorized(
                "ticket",
                "update",
                user,
                project,
                ticketDetails.ticket
              )
            }
            onClick={() => {
              store.dispatch(
                updateTicket(ticketDetails.ticket?._id!, {
                  status: "closed",
                })
              );
            }}
          >
            {ticketDetails.loading && ticketDetails.method.update ? (
              <ThreeDotsLoader />
            ) : (
              "Close Ticket"
            )}
          </button>
          {Authorized(
            "ticket",
            "delete",
            user,
            project,
            ticketDetails.ticket
          ) && (
            <button
              className={`bg-red-500 justify-center p-2 text-ss font-semibold rounded text-blue-50 hover:bg-red-600 disabled:opacity-75 disabled:cursor-not-allowed transition-colors flex-1 flex`}
              disabled={ticketDetails.loading || ticketDetails.method.delete}
              onClick={() => {
                setProjectDeleteModalOpen(true);
              }}
            >
              {ticketDetails.loading && ticketDetails.method.delete ? (
                <ThreeDotsLoader />
              ) : (
                "Delete Ticket"
              )}
            </button>
          )}
        </div>
      </div>
      {ticketDetails.ticket && (
        <TicketDeleteModal
          open={projectDeleteModalOpen}
          setOpen={setProjectDeleteModalOpen}
          ticket={ticketDetails.ticket!}
          loading={ticketDetails.loading}
          method={ticketDetails.method}
        />
      )}
    </aside>
  );
};

export default TicketDetailsBar;
